import { statsList } from "./setup.js";

const stats = new Map();
const n = 60;

export const performanceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        const key = entry.name.replace(" ", "-");
        const hasDt = statsList.querySelector(`dt.${key}`);
        if (!hasDt) {
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");
            dd.classList.add(key);
            dt.classList.add(key);
            dt.textContent = entry.name;
            statsList.append(dt, dd);
        }
        const values = stats.getOrInsert(entry.name, [])
        values.push(entry.duration);
        if (values.length >= n) {
            const total = values.reduce((p, c) => p + c, 0);
            const dd = statsList.querySelector(`dd.${key}`);
            dd.textContent = total / values.length;
            stats.delete(entry.name);
        }
  });
});
