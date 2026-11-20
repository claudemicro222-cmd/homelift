"""HomeLift: träningsschema, statistik och påminnelser från en självhostad HomeLift-server."""
from __future__ import annotations

import logging
from datetime import timedelta
from pathlib import Path

import aiohttp

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import CARD_URL, CONF_URL, DOMAIN, SCAN_INTERVAL_MINUTES

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR]


class HomeLiftCoordinator(DataUpdateCoordinator):
    """Hämtar sammanfattningen för alla profiler."""

    def __init__(self, hass: HomeAssistant, url: str) -> None:
        super().__init__(hass, _LOGGER, name=DOMAIN, update_interval=timedelta(minutes=SCAN_INTERVAL_MINUTES))
        self.url = url.rstrip("/")
        self.session = async_get_clientsession(hass)

    async def _async_update_data(self) -> dict:
        try:
            async with self.session.get(f"{self.url}/api/ha/summary", timeout=aiohttp.ClientTimeout(total=15)) as resp:
                resp.raise_for_status()
                data = await resp.json()
        except (aiohttp.ClientError, TimeoutError) as err:
            raise UpdateFailed(f"Kan inte nå HomeLift på {self.url}: {err}") from err
        data["profiles"] = {p["id"]: p for p in data.get("profiles", [])}
        return data


async def _register_card(hass: HomeAssistant) -> None:
    """Gör Lovelace-kortet tillgängligt utan att man behöver lägga till en resurs."""
    if hass.data.get(f"{DOMAIN}_card"):
        return
    hass.data[f"{DOMAIN}_card"] = True
    path = str(Path(__file__).parent / "frontend" / "homelift-card.js")
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, path, False)])
    except ImportError:  # äldre Home Assistant
        hass.http.register_static_path(CARD_URL, path, False)
    from homeassistant.components.frontend import add_extra_js_url

    version = (Path(__file__).parent / "manifest.json").stat().st_mtime_ns
    add_extra_js_url(hass, f"{CARD_URL}?v={version}")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    coordinator = HomeLiftCoordinator(hass, entry.data[CONF_URL])
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    await _register_card(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return ok
