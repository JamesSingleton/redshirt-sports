export default function VoteConfirmationPage({ params }: { params: { division: string } }) {
  const { division } = params
  return (
    <div>
      <h1>Vote Confirmation</h1>
      <p>You have successfully voted for the {division} division. Thank you for voting!</p>
    </div>
  )
}
