import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class AuthService {
  async setToken(token: string) {
    await Preferences.set({ key: 'token', value: token });
  }
  async getToken() {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  }
}