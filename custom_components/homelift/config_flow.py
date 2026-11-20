"""Konfiguration av HomeLift via gränssnittet."""
from __future__ import annotations

import aiohttp
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import CONF_URL, DOMAIN


class HomeLiftConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            url = user_input[CONF_URL].strip().rstrip("/")
            if not url.startswith(("http://", "https://")):
                url = "http://" + url
            try:
                session = async_get_clientsession(self.hass)
                async with session.get(f"{url}/api/health", timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    resp.raise_for_status()
                    await resp.json()
            except (aiohttp.ClientError, TimeoutError, ValueError):
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(url)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title="HomeLift", data={CONF_URL: url})
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_URL, default="http://192.168.1.10:8080"): str}),
            errors=errors,
        )
