import { bestbuy } from "./bestbuy.js";
import { bestbuySerp } from "./bestbuy-serp.js";
import { walmart } from "./walmart.js";

export const providers = [bestbuy, bestbuySerp, walmart];

export const active = (mode) => providers.filter((p) => p.mode === mode && p.enabled());
