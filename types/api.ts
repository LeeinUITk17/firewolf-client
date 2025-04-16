export enum AlertStatus {
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    IGNORED = 'IGNORED',
}

export enum SensorStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ERROR = 'ERROR',
    MAINTENANCE = 'MAINTENANCE',
}

export enum AlertOrigin {
    SENSOR_THRESHOLD = 'SENSOR_THRESHOLD',
    SENSOR_ERROR = 'SENSOR_ERROR',
    ML_DETECTION = 'ML_DETECTION',
    MANUAL_INPUT = 'MANUAL_INPUT',
}

export enum Role {
    ADMIN = 'ADMIN',
    SUPERVISOR = 'SUPERVISOR',
    USER = 'USER',
}

export interface Zone {
    id: string;
    name: string;
    description?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: string | Date;
}
export interface SensorLog {
    id: string;
    sensorId: string;
    temperature?: number | null;
    humidity?: number | null;
    createdAt: string | Date;
    sensor?: Sensor; // Optional relation back
}
export interface Sensor {
    id: string;
    name: string;
    type: string;
    location: string;
    threshold?: number | null;
    sensitivity?: number | null;
    status: SensorStatus;
    createdAt: string | Date;
    zoneId: string;
    zone?: Zone;
    latestLog?: SensorLog | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
    isActive: boolean;
}

export interface Camera {
    id: string;
    name: string;
    url: string;
    createdAt: string | Date;
    zoneId: string;
    zone?: Zone;
}

export interface Alert {
    id: string;
    message: string;
    origin: AlertOrigin;
    sensorId: string;
    userId?: string | null;
    cameraId?: string | null;
    imageUrl?: string | null;
    createdAt: string | Date;
    status: AlertStatus;
    viaEmail: boolean;
    sensor?: Sensor;
    user?: User;
    camera?: Camera;
}

export interface AlertWithRelations extends Alert {
    sensor?: Sensor & {
        zone?: Zone;
    };
}

export interface SensorWithDetails extends Sensor {
    zone?: Zone;
    latestLog?: SensorLog | null;
}


export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}
