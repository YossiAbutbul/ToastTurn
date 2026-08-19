import './Note.css';

type NoteProps = {
  /** Changing this replays the pop-in. Zero means nothing has happened yet. */
  playKey: number;
  text: string;
};

/** The little "Yossi did it!" card that flies up after a pop. */
export function Note({ playKey, text }: NoteProps) {
  if (playKey === 0) return null;
  return (
    <div className="note show" key={playKey} role="status">
      {text}
    </div>
  );
}
