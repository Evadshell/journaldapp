import Image from "next/image";
import FeatureTesting from "./FeatureTesting";

export default function Home() {
  return (
    <>
      <h1 className="text-4xl font-bold text-center mt-8">Hello Solana</h1>
      <FeatureTesting />
    </>
  );
}
