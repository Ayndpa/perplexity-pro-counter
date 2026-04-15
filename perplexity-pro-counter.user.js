// ==UserScript==
// @name         Perplexity Pro Counter
// @namespace    https://www.perplexity.ai/
// @version      1.0.0
// @description  Show remaining Pro queries on perplexity.ai
// @match        https://www.perplexity.ai/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const API_URL = 'https://www.perplexity.ai/rest/rate-limit/all';
  const STORAGE_KEY = 'copilot-perplexity-pro-counter';
  const WIDGET_ID = 'copilot-pro-counter-widget';
  const LABEL_ID = 'copilot-pro-counter-value';
  const HINT_ID = 'copilot-pro-counter-hint';
  const REFRESH_ID = 'copilot-pro-counter-refresh';
  const HEADER_ID = 'copilot-pro-counter-header';
  const BODY_ID = 'copilot-pro-counter-body';

  if (document.getElementById(WIDGET_ID)) {
    return;
  }

  const getTheme = () => {
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyBackground = bodyStyle.backgroundColor;
    const bodyColor = bodyStyle.color;
    const isDark = (() => {
      const match = bodyBackground.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!match) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      const red = Number(match[1]);
      const green = Number(match[2]);
      const blue = Number(match[3]);
      return (red * 299 + green * 587 + blue * 114) / 1000 < 140;
    })();

    if (isDark) {
      return {
        background: 'rgba(18, 20, 26, 0.92)',
        border: 'rgba(255, 255, 255, 0.10)',
        text: bodyColor || 'rgba(255, 255, 255, 0.94)',
        muted: 'rgba(255, 255, 255, 0.68)',
        chip: 'rgba(255, 255, 255, 0.08)',
        chipText: 'rgba(255, 255, 255, 0.96)',
        shadow: '0 16px 36px rgba(0, 0, 0, 0.30)',
      };
    }

    return {
      background: 'rgba(255, 255, 255, 0.92)',
      border: 'rgba(17, 24, 39, 0.08)',
      text: bodyColor || 'rgb(17, 24, 39)',
      muted: 'rgba(17, 24, 39, 0.64)',
      chip: 'rgba(17, 24, 39, 0.06)',
      chipText: 'rgb(17, 24, 39)',
      shadow: '0 18px 42px rgba(15, 23, 42, 0.16)',
    };
  };

  const theme = getTheme();

  const widget = document.createElement('div');
  widget.id = WIDGET_ID;
  widget.setAttribute('role', 'status');
  widget.setAttribute('aria-live', 'polite');
  widget.style.cssText = [
    'position: fixed',
    'right: 16px',
    'bottom: 16px',
    'z-index: 2147483647',
    'display: flex',
    'flex-direction: column',
    'width: 250px',
    'overflow: hidden',
    'border-radius: 18px',
    `border: 1px solid ${theme.border}`,
    `background: ${theme.background}`,
    `box-shadow: ${theme.shadow}`,
    'backdrop-filter: blur(18px)',
    'color: inherit',
    'font: inherit',
    'line-height: 1.2',
    'user-select: none',
    'max-width: calc(100vw - 32px)',
  ].join('; ');

  widget.innerHTML = `
    <div id="${HEADER_ID}" style="display:flex;align-items:center;gap:10px;padding:12px 12px 10px 12px;cursor:grab;">
      <div style="width:24px;height:24px;display:grid;place-items:center;border-radius:8px;background:${theme.chip};color:${theme.muted};flex:0 0 auto;font-size:14px;line-height:1;">⋮⋮</div>
      <div style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1 1 auto;">
        <div style="display:flex;align-items:baseline;gap:8px;min-width:0;">
          <div style="font-size:13px;font-weight:600;letter-spacing:0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#ffffff;">Pro 查询剩余</div>
          <div id="${LABEL_ID}" style="margin-left:auto;display:flex;align-items:baseline;gap:6px;padding:4px 10px;border-radius:999px;background:${theme.chip};color:${theme.chipText};border:1px solid ${theme.border};white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);">
            <span style="font-size:11px;font-weight:500;opacity:0.78;letter-spacing:0.02em;">剩余</span>
            <span data-value style="font-size:14px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;">加载中...</span>
          </div>
        </div>
        <div style="font-size:12px;color:${theme.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">来自 /rest/rate-limit/all</div>
      </div>
      <button id="${REFRESH_ID}" type="button" aria-label="手动刷新" style="width:32px;height:28px;border:0;border-radius:10px;background:${theme.chip};color:#ffffff;cursor:pointer;display:grid;place-items:center;flex:0 0 auto;font-size:12px;font-weight:600;">↻</button>
    </div>
    <div id="${BODY_ID}" style="display:flex;flex-direction:column;gap:8px;padding:0 12px 12px 12px;">
      <div id="${HINT_ID}" style="font-size:13px;color:${theme.muted};user-select:text;">正在读取额度...</div>
    </div>
  `;

  const mount = () => {
    document.body.appendChild(widget);
  };

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  }

  const valueEl = widget.querySelector(`#${LABEL_ID}`);
  const valueTextEl = valueEl ? valueEl.querySelector('[data-value]') : null;
  const hintEl = widget.querySelector(`#${HINT_ID}`);
  const refreshEl = widget.querySelector(`#${REFRESH_ID}`);
  const headerEl = widget.querySelector(`#${HEADER_ID}`);

  const readState = () => {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const writeState = (nextState) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const applyPosition = (left, top) => {
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  };

  const clampPosition = (left, top) => {
    const rect = widget.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(0, window.innerHeight - rect.height - 8);

    return {
      left: Math.min(Math.max(8, left), maxLeft),
      top: Math.min(Math.max(8, top), maxTop),
    };
  };

  const state = readState();
  const savedLeft = Number.isFinite(state.left) ? state.left : null;
  const savedTop = Number.isFinite(state.top) ? state.top : null;

  if (savedLeft !== null && savedTop !== null) {
    applyPosition(savedLeft, savedTop);
  }

  const setValue = (text) => {
    if (valueTextEl) {
      valueTextEl.textContent = text;
    } else if (valueEl) {
      valueEl.textContent = text;
    }
  };

  const setHint = (text) => {
    if (hintEl) {
      hintEl.textContent = text;
    }
  };

  const fetchRemaining = async () => {
    try {
      const response = await fetch(API_URL, {
        credentials: 'include',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const remaining = data?.remaining_pro;

      if (typeof remaining === 'number' || typeof remaining === 'string') {
        setValue(String(remaining));
        setHint('');
      } else {
        setValue('未找到 remaining_pro');
        setHint('接口已返回，但没有识别到字段');
      }
    } catch (error) {
      setValue('读取失败');
      setHint('请确认已登录并允许读取接口');
      console.error('[Perplexity Pro Counter] Failed to load rate limit data:', error);
    }
  };

  if (refreshEl) {
    refreshEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      refreshEl.setAttribute('disabled', 'true');
      refreshEl.style.opacity = '0.7';
      refreshEl.style.cursor = 'wait';
      fetchRemaining().finally(() => {
        refreshEl.removeAttribute('disabled');
        refreshEl.style.opacity = '1';
        refreshEl.style.cursor = 'pointer';
      });
    });
  }

  if (headerEl) {
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onMouseMove = (event) => {
      if (!dragging) {
        return;
      }

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const next = clampPosition(startLeft + deltaX, startTop + deltaY);
      applyPosition(next.left, next.top);
    };

    const endDrag = () => {
      if (!dragging) {
        return;
      }

      dragging = false;
      headerEl.style.cursor = 'grab';

      const nextLeft = widget.style.left ? Number.parseFloat(widget.style.left) : startLeft;
      const nextTop = widget.style.top ? Number.parseFloat(widget.style.top) : startTop;
      writeState({
        left: nextLeft,
        top: nextTop,
      });

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      pointerId = null;
    };

    headerEl.addEventListener('mousedown', (event) => {
      if (event.target === refreshEl || event.button !== 0) {
        return;
      }

      dragging = true;
      pointerId = 1;
      const rect = widget.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      headerEl.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', endDrag);
      event.preventDefault();
    });
  }

  fetchRemaining();
})();
