type Props = {
  title: string
  description: string
}

// 阶段 0 用的占位页面，后续阶段会被真正的功能替换
export default function PlaceholderPage({ title, description }: Props) {
  return (
    <section>
      <h1 className="py-4 text-2xl font-bold">{title}</h1>
      <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {description}
      </div>
    </section>
  )
}
