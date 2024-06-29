import {
  type CookieSerializeOptions,
  parse as parseCookie,
  serialize as serializeCookie,
} from "cookie";
import { deepFreeze, type DeepFreezed } from "./utils";

export interface Cookie {
  name: string;
  value: string;
  options?: CookieSerializeOptions;
}

type CookieEntry = DeepFreezed<Cookie> & { isInitial?: boolean; isDeleted?: boolean };

/**
 * A container for the cookies.
 */
export class Cookies {
  #cookiesMap = new Map<string, CookieEntry>();

  constructor(cookies?: Record<string, string>) {
    const map = new Map<string, CookieEntry>();

    if (cookies) {
      for (const [name, value] of Object.entries(cookies)) {
        map.set(name, { name, value, isInitial: true });
      }
    }

    this.#cookiesMap = map;
  }

  /**
   * Creates a `Cookie` from the given headers.
   * @param headers The headers.
   */
  static fromHeaders(headers: Headers): Cookies {
    const rawCookie = headers.get("Cookie");
    const cookieObject = rawCookie == null ? {} : parseCookie(rawCookie);
    return new Cookies(cookieObject);
  }

  /**
   * Get a cookie value with the given name.
   * @param name The name of the cookie.
   */
  get(name: string): string | undefined {
    const cookie = this.#cookiesMap.get(name);
    return cookie && !cookie.isDeleted ? cookie.value : undefined;
  }

  /**
   * Checks if the cookie exists.
   * @param name The name of the cookie.
   */
  has(name: string) {
    return this.get(name) !== undefined;
  }

  /**
   * Sets a cookie with the given name-value.
   * @param name The name of the cookie.
   * @param value The value of the cookie.
   * @param options Options for the cookie.
   */
  set(name: string, value: string, options?: CookieSerializeOptions) {
    const cookie = deepFreeze<Cookie>({
      name,
      value,
      options,
    });

    this.#cookiesMap.set(name, cookie);
  }

  /**
   * Delete the cookie with the given name.
   * @param name The name of the cookie to delete.
   */
  delete(name: string): boolean {
    const cookie = this.#cookiesMap.get(name);

    if (!cookie) {
      return false;
    }

    // If is an initial cookie, we need to emit a 'set-cookie' to delete it
    if (cookie.isInitial) {
      const cookie = deepFreeze<CookieEntry>({
        name,
        value: "",
        isDeleted: true,
        options: {
          expires: new Date(0),
        },
      });

      this.#cookiesMap.set(name, cookie);
    } else {
      this.#cookiesMap.delete(name);
    }

    return true;
  }

  /**
   * Gets an object with the values.
   */
  toJSON(): Record<string, string | undefined> {
    const obj: Record<string, string> = {};

    for (const [name, value] of this.entries()) {
      obj[name] = value;
    }

    return obj;
  }

  /**
   * Returns an iterator over the cookies.
   */
  *entries(): Generator<[string, string]> {
    for (const [name, cookie] of this.#cookiesMap) {
      if (cookie.isDeleted) {
        continue;
      }

      yield [name, cookie.value] as const;
    }
  }

  /**
   * Returns the `set-cookie` values.
   */
  serialize(): string[] {
    const cookies: string[] = [];

    for (const [name, cookie] of this.#cookiesMap) {
      cookies.push(serializeCookie(name, cookie.value, cookie.options));
    }

    return cookies;
  }
}

/**
 * Sets the `set-cookie` to the response.
 * @internal
 */
export function applyResponseCookies(response: Response, cookies: Cookies) {
  const headers = response.headers;
  for (const value of cookies.serialize()) {
    headers.append("Set-Cookie", value);
  }
}
