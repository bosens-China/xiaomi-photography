const list = document.querySelector<HTMLUListElement>('.gallery-grid');
const gallery = list?.closest<HTMLElement>('[data-issue]');
const picker = document.querySelector<HTMLDetailsElement>('.issue-picker');

function arrange() {
  if (!list) return;
  const styles = getComputedStyle(list);
  const columns = Number(styles.getPropertyValue('--columns'));
  list.toggleAttribute('data-masonry', columns > 1);
  if (columns < 2) return;

  const gap = parseFloat(styles.getPropertyValue('--gap'));
  const cards = list.querySelectorAll<HTMLElement>(':scope > li');
  const heights = Array.from(
    cards,
    (card) => card.getBoundingClientRect().height,
  );
  const bottoms = Array<number>(columns).fill(0);

  cards.forEach((card, index) => {
    const top = Math.min(...bottoms);
    const column = bottoms.indexOf(top);
    card.style.setProperty('--column', String(column));
    card.style.setProperty('--top', `${top}px`);
    bottoms[column] = top + heights[index] + gap;
  });

  list.style.setProperty(
    '--gallery-height',
    `${Math.max(0, Math.max(...bottoms) - gap)}px`,
  );
}

if (list && typeof ResizeObserver !== 'undefined') {
  arrange();
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(arrange);
  });
  observer.observe(list);
  for (const card of list.children) observer.observe(card);
}

if (picker) {
  document.addEventListener('click', (event) => {
    if (!picker.open) return;
    if (event.target instanceof Node && !picker.contains(event.target)) {
      picker.open = false;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker.open) {
      picker.open = false;
      picker.querySelector('summary')?.focus();
    }
  });
}

if (gallery) {
  const key = `gallery-scroll:${gallery.dataset.issue}`;
  const originKey = `gallery-origin:${gallery.dataset.issue}`;
  gallery.addEventListener('click', (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('a[data-photo]')
    )
      return;
    try {
      sessionStorage.setItem(key, String(scrollY));
      sessionStorage.setItem(originKey, location.pathname);
    } catch {
      return;
    }
  });

  const page = new URL(location.href);
  if (page.searchParams.get('from') === 'photo') {
    try {
      scrollTo({
        top: Number(sessionStorage.getItem(key)) || 0,
        behavior: 'instant',
      });
    } catch {
      scrollTo(0, 0);
    }
    page.searchParams.delete('from');
    history.replaceState(history.state, '', page);
  }
}

function recover(img: HTMLImageElement) {
  if (!img.closest('.gallery-image')) return;
  if (img.hasAttribute('srcset') && img.dataset.original) {
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = img.dataset.original;
  } else {
    img.hidden = true;
    img.nextElementSibling?.removeAttribute('hidden');
  }
}

document.addEventListener(
  'error',
  (event) => {
    if (event.target instanceof HTMLImageElement) recover(event.target);
  },
  true,
);
for (const img of document.querySelectorAll<HTMLImageElement>(
  '.gallery-image img',
)) {
  if (img.complete && !img.naturalWidth) recover(img);
}
