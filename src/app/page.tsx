import SoccerField from '@/app/components/SoccerField'; // この行を修正
// // src/app/page.tsx
export default function Home() {
  return (
    // <main> ... </main> がページの主な内容を表します
    // className="..." は見た目を整えるための Tailwind CSS の設定です
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-green-100">
      <h1 className="text-4xl font-bold mb-8">サッカーアプリ</h1>

      <SoccerField /> {/* 作成したコンポーネントをここで呼び出す */}

    </main>
  );
}