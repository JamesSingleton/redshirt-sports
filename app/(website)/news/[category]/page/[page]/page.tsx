export default async function Page({ params }: { params: { page: string } }) {
  console.log(params)
  return (
    <>
      <h1>{`Hello From ${params.page}`}</h1>
    </>
  )
}
