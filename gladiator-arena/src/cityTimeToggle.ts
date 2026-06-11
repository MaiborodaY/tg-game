import { getCityTimeOfDay, setCityTimeOfDay, subscribeCityTimeOfDayChanges, type CityTimeOfDay } from "./ArenaScene";

export function mountCityTimeToggle(button: HTMLButtonElement | null, cityMenu: HTMLElement | null): () => void {
  if (!button) {
    syncCityTimeClass(cityMenu, getCityTimeOfDay());
    return () => undefined;
  }

  const sync = (timeOfDay: CityTimeOfDay) => {
    const isDay = timeOfDay === "day";

    button.classList.toggle("city-menu__time-toggle--day", isDay);
    button.setAttribute("aria-pressed", String(isDay));
    button.setAttribute("aria-label", isDay ? "Switch to night" : "Switch to day");
    syncCityTimeClass(cityMenu, timeOfDay);
  };
  const unsubscribe = subscribeCityTimeOfDayChanges(sync);
  const handleClick = () => setCityTimeOfDay(getCityTimeOfDay() === "day" ? "night" : "day");

  button.addEventListener("click", handleClick);
  sync(getCityTimeOfDay());

  return () => {
    button.removeEventListener("click", handleClick);
    unsubscribe();
  };
}

function syncCityTimeClass(cityMenu: HTMLElement | null, timeOfDay: CityTimeOfDay): void {
  cityMenu?.classList.toggle("city-menu--day", timeOfDay === "day");
}
