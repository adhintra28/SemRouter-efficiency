import RouterDashboard from '@/components/RouterDashboard';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <RouterDashboard />
    </main>
  );
}
