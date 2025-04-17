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
    sensors?: Sensor[];
    cameras?: Camera[];
    _count?: { sensors?: number; cameras?: number };
}

export interface SensorLog {
    id: string;
    sensorId: string;
    temperature?: number | null;
    humidity?: number | null;
    createdAt: string | Date;
    sensor?: Sensor;
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
    latitude?: number | null;
    longitude?: number | null;
    zone?: Zone;
    latestLog?: SensorLog | null;
    activeAlert?: Alert | null;
    logs?: SensorLog[];
}

export interface User {}

export interface Camera {
    id: string;
    name: string;
    url: string;
    createdAt: string | Date;
    zoneId: string;
    latitude?: number | null;
    longitude?: number | null;
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
    sensor?: Sensor & { zone?: Zone };
    user?: User;
    camera?: Camera;
}

export interface ZoneWithDetails extends Zone {
    sensors?: Sensor[];
    cameras?: Camera[];
}

export interface SensorWithDetails extends Sensor {
    zone?: Zone;
    logs?: SensorLog[];
    latestLog?: SensorLog | null;
    activeAlert?: Alert | null;
}

export interface CameraWithDetails extends Camera {
    zone?: Zone;
}

export interface AlertWithDetails extends Alert {
    sensor?: Sensor & { zone?: Zone };
    user?: User;
    camera?: Camera & { zone?: Zone };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}
export interface AlertWithRelations extends Alert {
    sensor?: Sensor & {
        zone?: Zone;
    };
}