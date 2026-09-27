export enum NotificationType {
  PRICE_CHANGE = 'PRICE_CHANGE',
}

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly coffeeGrowerId: string,
    public readonly type: NotificationType,
    public readonly date: Date,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    coffeeGrowerId: string,
    type: NotificationType,
    date: Date = new Date(),
  ): Notification {
    const now = new Date();
    return new Notification(id, coffeeGrowerId, type, date, false, now);
  }

  static reconstitute(
    id: string,
    coffeeGrowerId: string,
    type: NotificationType,
    date: Date,
    read: boolean,
    createdAt: Date,
  ): Notification {
    return new Notification(id, coffeeGrowerId, type, date, read, createdAt);
  }

  markAsRead(): Notification {
    return Notification.reconstitute(
      this.id,
      this.coffeeGrowerId,
      this.type,
      this.date,
      true,
      this.createdAt,
    );
  }
}