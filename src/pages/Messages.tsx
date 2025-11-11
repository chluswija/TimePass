import SidebarNavigation from '@/components/Layout/SidebarNavigation';

const Messages = () => {
  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-4xl pt-6 pb-20 md:pb-6 px-4">
          <h1 className="text-2xl font-semibold mb-6">Messages</h1>

          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No messages yet. Start a conversation with your friends!
            </p>
          </div>
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Messages;
