import Link from 'next/link';
import {
  Bell,
  MessageCircle,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getNotificationsAndMarkResponsesRead } from '@/app/actions';
import type { Notification, NotificationType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ICONS: Record<NotificationType, typeof MessageCircle> = {
  message: MessageCircle,
  participation_request: UserPlus,
  participation_approved: CheckCircle2,
  participation_rejected: XCircle,
};

function formatNotificationTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default async function NotificationsPage() {
  // L'ouverture de la page marque les réponses (participation validée / refusée)
  // comme lues : elles disparaissent de la cloche.
  const result = await getNotificationsAndMarkResponsesRead();
  const notifications: Notification[] = result.success
    ? result.data ?? []
    : [];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-6 border-b border-gray-100 sticky top-14 bg-white/90 backdrop-blur-md z-40">
        <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Demandes et réponses</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!result.success && (
          <p className="text-red-500 text-sm p-4 text-center">{result.error}</p>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Aucune notification pour le moment.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = ICONS[notif.type] ?? Bell;
            const content = (
              <div
                className={`flex items-start gap-3 p-4 border-b border-gray-50 last:border-0 transition-colors ${
                  notif.is_read ? 'bg-white' : 'bg-primary/5'
                } hover:bg-gray-50`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.is_read
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {notif.title}
                    </h3>
                    <span className="text-xs flex-shrink-0 text-gray-400">
                      {formatNotificationTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                </div>

                {!notif.is_read && (
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );

            return notif.link ? (
              <Link href={notif.link} key={notif.id}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
