export interface LocationData {
    longitude: number;
    latitude: number;
    name: string;
    address?: string;
}

export function compareLocationData(a: LocationData, b: LocationData): boolean {
    if ((a.latitude || b.latitude) && a.latitude !== b.latitude) return false;
    if ((a.longitude || b.longitude) && a.longitude !== b.longitude) return false;
    if ((a.address || b.address) && a.address !== b.address) return false;
    if ((a.name || b.name) && a.name !== b.name) return false;
    return true;
}
