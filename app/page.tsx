import Invitation from "@/components/Invitation";

export default function Home() {
  return (
    <Invitation
      personalizedMode={false}
      mainGuest="Mohamed"
      plusOne="Habiba"
      direction="ltr"
    />
  );
}
