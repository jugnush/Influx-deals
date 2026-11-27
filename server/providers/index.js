import { bestbuy } from "./bestbuy.js";
import { walmart } from "./walmart.js";

export const providers = [bestbuy, walmart];

export const active = (mode) => providers.filter((p) => p.mode === mode && p.enabled());
