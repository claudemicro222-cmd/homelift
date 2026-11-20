"""Gemensam bas för HomeLift-entiteter: en enhet per profil."""
from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN


class HomeLiftEntity(CoordinatorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator, entry_id: str, profile_id: int, key: str) -> None:
        super().__init__(coordinator)
        self.profile_id = profile_id
        self._attr_unique_id = f"{entry_id}_{profile_id}_{key}"
        self._attr_translation_key = key
        name = self.profile.get("name", "HomeLift")
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry_id}_{profile_id}")},
            name=f"HomeLift {name}",
            manufacturer="HomeLift",
            model="Träningsprofil",
            sw_version=coordinator.data.get("version"),
            configuration_url=coordinator.url,
        )

    @property
    def profile(self) -> dict:
        return self.coordinator.data["profiles"].get(self.profile_id, {})

    @property
    def available(self) -> bool:
        return super().available and self.profile_id in self.coordinator.data["profiles"]
