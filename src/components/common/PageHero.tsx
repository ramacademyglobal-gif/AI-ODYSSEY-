import { clsx } from "clsx";

interface PageHeroProps {
  pageId: string;
  index: string;
  title: string;
  titleAccent?: string;
  description?: string;
  className?: string;
}

export default function PageHero({
  pageId,
  index,
  title,
  titleAccent,
  description,
  className,
}: PageHeroProps) {
  return (
    <header
      className={clsx(
        "border-b border-[var(--border-primary)] bg-[var(--bg-primary)] pt-24 pb-12 md:pt-28 md:pb-16",
        className
      )}
    >
      <div className="content-wrap">
        <p className="label-tech mb-5">
          PAGE-{index} {"//"} {pageId}
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h1 className="font-serif text-page text-[var(--text-primary)] max-w-4xl">
            {title}
            {titleAccent ? (
              <>
                <br />
                <span className="italic text-[var(--accent)]">{titleAccent}</span>
              </>
            ) : null}
          </h1>
          <span className="font-mono-custom text-4xl md:text-5xl font-semibold text-[var(--accent)] glow-num-text tracking-widest">
            {index}
          </span>
        </div>
        {description ? (
          <p className="mt-6 max-w-2xl text-[var(--text-muted)] text-base md:text-lg leading-relaxed">
            {description}
          </p>
        ) : null}
        <div className="odyssey-rule mt-10 origin-left" />
      </div>
    </header>
  );
}
