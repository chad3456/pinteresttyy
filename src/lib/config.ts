const ALLOWED_COLUMNS = [2, 3, 4, 5, 6] as const;

function parseColumns(value: string | undefined): (typeof ALLOWED_COLUMNS)[number] {
  const parsed = Number(value);
  return (ALLOWED_COLUMNS as readonly number[]).includes(parsed)
    ? (parsed as (typeof ALLOWED_COLUMNS)[number])
    : 4;
}

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gallery";
export const ACCENT_COLOR = process.env.NEXT_PUBLIC_ACCENT_COLOR || "#c9a227";
export const GRID_COLUMNS = parseColumns(process.env.NEXT_PUBLIC_GRID_COLUMNS);
