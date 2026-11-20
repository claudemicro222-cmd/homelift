"""Sensorer per profil."""
from __future__ import annotations

from datetime import date

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfMass

from .const import DOMAIN
from .entity import HomeLiftEntity


def _date(value):
    try:
        return date.fromisoformat(value) if value else None
    except ValueError:
        return None


SENSORS = {
    # nyckel: (värde, enhet, device_class, state_class, ikon)
    "next_workout": (lambda p: (p.get("next_workout") or {}).get("name"), None, None, None, "mdi:dumbbell"),
    "sessions_this_week": (lambda p: p.get("sessions_this_week"), "pass", None, SensorStateClass.MEASUREMENT, "mdi:calendar-check"),
    "week_streak": (lambda p: p.get("week_streak"), "veckor", None, SensorStateClass.MEASUREMENT, "mdi:fire"),
    "total_sessions": (lambda p: p.get("total_sessions"), "pass", None, SensorStateClass.TOTAL_INCREASING, "mdi:counter"),
    "last_session": (lambda p: _date((p.get("last_session") or {}).get("date")), None, SensorDeviceClass.DATE, None, "mdi:history"),
    "next_training_date": (lambda p: _date(p.get("next_training_date")), None, SensorDeviceClass.DATE, None, "mdi:calendar-arrow-right"),
    "weight": (lambda p: p.get("weight"), UnitOfMass.KILOGRAMS, SensorDeviceClass.WEIGHT, SensorStateClass.MEASUREMENT, "mdi:scale-bathroom"),
    "bmi": (lambda p: p.get("bmi"), None, None, SensorStateClass.MEASUREMENT, "mdi:human"),
    "weekly_goal": (lambda p: p.get("weekly_goal"), "pass", None, None, "mdi:target"),
    "goal_streak": (lambda p: p.get("goal_streak"), "veckor", None, SensorStateClass.MEASUREMENT, "mdi:trophy"),
}


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    known: set[int] = set()

    def add_new():
        new = [pid for pid in coordinator.data["profiles"] if pid not in known]
        known.update(new)
        async_add_entities(HomeLiftSensor(coordinator, entry.entry_id, pid, key) for pid in new for key in SENSORS)

    add_new()
    entry.async_on_unload(coordinator.async_add_listener(add_new))


class HomeLiftSensor(HomeLiftEntity, SensorEntity):
    def __init__(self, coordinator, entry_id, profile_id, key):
        super().__init__(coordinator, entry_id, profile_id, key)
        self.key = key
        _, unit, device_class, state_class, icon = SENSORS[key]
        self._attr_native_unit_of_measurement = unit
        self._attr_device_class = device_class
        self._attr_state_class = state_class
        self._attr_icon = icon

    @property
    def native_value(self):
        return SENSORS[self.key][0](self.profile)

    @property
    def extra_state_attributes(self):
        # Hela sammanfattningen ligger på "Nästa pass" så att kortet kan visa allt från en entitet
        if self.key != "next_workout":
            return None
        p = self.profile
        return {
            "homelift": True,
            "profile": p.get("name"),
            "program": p.get("program"),
            "next_workout": p.get("next_workout"),
            "next_training": p.get("next_training"),
            "next_training_date": p.get("next_training_date"),
            "today": p.get("today"),
            "training_days": p.get("training_days"),
            "planned_per_week": p.get("planned_per_week"),
            "sessions_this_week": p.get("sessions_this_week"),
            "sessions_last_7_days": p.get("sessions_last_7_days"),
            "week_streak": p.get("week_streak"),
            "weekly_goal": p.get("weekly_goal"),
            "weekly_goal_reached": p.get("weekly_goal_reached"),
            "goal_streak": p.get("goal_streak"),
            "total_sessions": p.get("total_sessions"),
            "last_session": p.get("last_session"),
            "weight": p.get("weight"),
            "height_cm": p.get("height_cm"),
            "bmi": p.get("bmi"),
            "url": self.coordinator.url,
        }
