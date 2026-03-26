import Store from "electron-store";
import type { ThemeSource } from "@type/theme";

interface UserSettingsSchema {
  theme: ThemeSource;
}

export class UserPreferencesStore {
  private store;

  constructor() {
    this.store = new Store<UserSettingsSchema>({
      name: "user",
      defaults: {
        theme: "system",
      },
    });
  }

  getThemeSource(): ThemeSource {
    return this.store.get("theme");
  }

  setThemeSource(theme: ThemeSource): void {
    this.store.set("theme", theme);
  }
}
