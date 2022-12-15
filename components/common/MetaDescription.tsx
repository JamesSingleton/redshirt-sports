export default function MetaDescription({ value }: { value: string }) {
  return <meta key="description" name="description" content={value} />
}
