export declare function checkOngkir(params: {
    origin_postal_code: string;
    destination_postal_code: string;
    weight_gram: number;
    couriers?: string;
}): Promise<{
    courier: string;
    service: string;
    price: number;
    estimated_days: string;
    description: string;
}[]>;
export declare function createShipment(params: {
    orderId: string;
    origin: {
        contact_name: string;
        contact_phone: string;
        address: string;
        postal_code: string;
    };
    destination: {
        contact_name: string;
        contact_phone: string;
        address: string;
        postal_code: string;
    };
    courier_code: string;
    courier_service: string;
    items: {
        name: string;
        quantity: number;
        value: number;
        weight: number;
    }[];
}): Promise<{
    shipment_id: string;
    tracking_id: string;
    waybill_id: string;
}>;
export declare function trackShipment(waybill_id: string, courier_code: string): Promise<{
    status: string;
    events: {
        time: string;
        description: string;
        location?: string;
    }[];
}>;
export declare function getAvailableCouriers(): Promise<string[]>;
