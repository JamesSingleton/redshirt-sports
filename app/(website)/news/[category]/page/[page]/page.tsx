export default async function Page({ params }: { params: { page: string } }) {
  return (
    <>
      <h1>{`Hello From ${params.page}`}</h1>
    </>
  )
}
