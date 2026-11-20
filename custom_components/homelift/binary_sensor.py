"""Binär sensor: är det träningsdag idag?"""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity

from .const import DOMAIN
from .entity import HomeLiftEntity


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    known: set[int] = set()

    def add_new():
        new = [pid for pid in coordinator.data["profiles"] if pid not in known]
        known.update(new)
        async_add_entities(e for pid in new for e in (TrainingToday(coordinator, entry.entry_id, pid), WeeklyGoalReached(coordinator, entry.entry_id, pid)))

    add_new()
    entry.async_on_unload(coordinator.async_add_listener(add_new))


class TrainingToday(HomeLiftEntity, BinarySensorEntity):
    _attr_icon = "mdi:weight-lifter"

    def __init__(self, coordinator, entry_id, profile_id):
        super().__init__(coordinator, entry_id, profile_id, "training_today")

    @property
    def is_on(self) -> bool:
        return bool(self.profile.get("today"))

    @property
    def extra_state_attributes(self):
        today = self.profile.get("today") or {}
        return {
            "workout": today.get("name"),
            "kind": today.get("kind"),
            "minutes": today.get("minutes"),
            "done": bool(today.get("done")),
            "profile": self.profile.get("name"),
        }


class WeeklyGoalReached(HomeLiftEntity, BinarySensorEntity):
    _attr_icon = "mdi:target-account"

    def __init__(self, coordinator, entry_id, profile_id):
        super().__init__(coordinator, entry_id, profile_id, "weekly_goal_reached")

    @property
    def is_on(self) -> bool:
        return bool(self.profile.get("weekly_goal_reached"))

    @property
    def extra_state_attributes(self):
        p = self.profile
        return {
            "sessions_this_week": p.get("sessions_this_week"),
            "weekly_goal": p.get("weekly_goal"),
            "goal_streak": p.get("goal_streak"),
            "profile": p.get("name"),
        }
