interface NotesWidgetProps {
  content: string;
  onChange: (content: string) => void;
}

export function NotesWidget({ content, onChange }: NotesWidgetProps) {
  return (
    <div className="wcard">
      <div className="wh">
        <span>便签</span>
        <div className="wh-right">
          <span>本地保存</span>
        </div>
      </div>
      <div className="wb">
        <textarea
          className="notes-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="记录临时想法、清单或备忘…"
          aria-label="便签内容"
        />
      </div>
    </div>
  );
}
