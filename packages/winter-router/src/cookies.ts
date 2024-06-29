import {
  type CookieSerializeOptions,
  parse as parseCookie,
  serialize as serializeCookie,
} from "cookie";
import { deepFreeze, type DeepFreezed } from "./utils.js";

export interface Cookie {
  name: string;
  value: string;
  options?: CookieSerializeOptions;
}

type CookieEntry = DeepFreezed<Cookie> & { isDeleted?: boolean };

/**
 * A container for the cookies.
 */
export class Cookies {
  #cookieMap = new Map<string, CookieEntry>();

  constructor(cookies?: Record<string, string>) {
    const map = new Map<string, DeepFreezed<Cookie>>();

    if (cookies) {
      for (const [name, value] of Object.entries(cookies)) {
        const cookie = deepFreeze<Cookie>({ name, value });
        map.set(name, cookie);
      }
    }

    this.#cookieMap = map;
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
    const cookie = this.#cookieMap.get(name);

    if (cookie && cookie.isDeleted) {
      return undefined;
    }

    return cookie?.value;
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

    this.#cookieMap.set(name, cookie);
  }

  /**
   * Delete the cookie with the given name.
   * @param name The name of the cookie to delete.
   */
  delete(name: string): boolean {
    if (!this.#cookieMap.has(name)) {
      return false;
    }

    // We need to keep tracking the cookie to later emit a set cookie
    const cookie = deepFreeze<CookieEntry>({
      name,
      value: "",
      isDeleted: true,
      options: {
        expires: new Date(0),
      },
    });

    this.#cookieMap.set(name, cookie);
    return true;
  }

  /**
   * Gets an object with the values.
   * @param skipDeleted Whether if to skip the deleted cookies, defaults to `true`.
   * @returns
   */
  toJSON(skipDeleted = true): Record<string, string | undefined> {
    const obj: Record<string, string> = {};

    for (const [name, value] of this.entries(skipDeleted)) {
      obj[name] = value?.value;
    }

    return obj;
  }

  /**
   * Returns an iterator over the cookies.
   *
   * @param skipDeleted Whether if to skip the deleted cookies, defaults to `true`.
   */
  *entries(skipDeleted = true): Generator<[string, DeepFreezed<Cookie>]> {
    for (const [name, cookie] of this.#cookieMap) {
      if (skipDeleted && cookie.isDeleted) {
        continue;
      }

      yield [name, cookie] as const;
    }
  }
}

/**
 * Sets the `set-cookie` to the response.
 * @internal
 */
export function applyResponseCookies(response: Response, cookies: Cookies) {
  const headers = response.headers;
  for (const [name, cookie] of cookies.entries(true)) {
    headers.append("Set-Cookie", serializeCookie(name, cookie.value, cookie.options));
  }
}
