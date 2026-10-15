import clsx from 'clsx';

const FURNI = {
  webApi: [75694, 'wf_xtra_var_web_api'],
  user: [71472, 'wf_var_user'],
  furni: [71472, 'wf_var_furni'],
  room: [71472, 'wf_var_room'],
  reference: [71472, 'wf_var_reference'],
  changed: [71472, 'wf_trg_var_changed'],
  valueMatch: [71472, 'wf_cnd_var_val_match'],
  leaderboard: [75953, 'wf_xtra_var_leaderboard'],
  import: [75953, 'wf_xtra_var_import'],
  echo: [72921, 'wf_var_echo'],
} as const;

export type FurniName = keyof typeof FURNI;

function furniUrl(name: FurniName): string {
  const [revision, classname] = FURNI[name];
  return `https://cdn.habbodan.com/furni/${revision}/${classname}-large.png?size=large`;
}

interface WiredFurniProps {
  name: FurniName;
  size?: number;
  className?: string;
}

export function WiredFurni({ name, size = 48, className }: WiredFurniProps) {
  return (
    <img
      src={furniUrl(name)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={clsx('pixelated object-contain select-none', className)}
      style={{ width: size, height: size }}
    />
  );
}
