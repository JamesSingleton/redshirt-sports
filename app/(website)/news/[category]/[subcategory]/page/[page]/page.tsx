export default async function Page({
  params,
  searchParams,
}: {
  params: { page: string }
  searchParams: { [key: string]: string }
}) {
  return (
    <>
      <h1>{`Hello From ${params.page}`}</h1>
      {Object.keys(searchParams).map((key) => (
        <p key={key}>
          {key}: {searchParams[key]}
        </p>
      ))}
    </>
  )
}
