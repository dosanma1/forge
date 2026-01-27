export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
	type: NotificationType;
	title: string;
	message: string;
}
