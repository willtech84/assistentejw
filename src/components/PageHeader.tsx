export default function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {action}
    </header>
  );
}
