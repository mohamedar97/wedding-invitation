import InvitationPage from "@/components/InvitationPage";

export default function Home() {
  return (
    <InvitationPage
      personalizedMode={false}
      mainGuest="Mohamed"
      plusOne="Habiba"
      direction="ltr"
    />
  );
}
