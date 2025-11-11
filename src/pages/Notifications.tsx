import SidebarNavigation from '@/components/Layout/SidebarNavigation';

const Notifications = () => {
  return (
    <SidebarNavigation>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-2xl pt-6 pb-20 md:pb-6 px-4">
        <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
        
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            No notifications yet. When someone likes or comments on your posts, you'll see them here.
          </p>
        </div>
      </main>
    </div>
    </SidebarNavigation>
  );
};

export default Notifications;
