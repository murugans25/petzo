import type {Pet} from './data';
import type {Purpose,DiscoveryPreferences} from './discovery';
export type ListingStatus='approved'|'pending'|'rejected'|'draft';
export type ManagedPet=Pet&{images?:string[];photoTitles?:Record<string,string>;lookingFor?:Purpose[];discoveryPreferences?:DiscoveryPreferences;dateOfBirth?:string;preferences?:string;pedigree?:string;status:ListingStatus;availability:boolean;description:string;health:string;vaccination:string;weight:number;temperament:string;ownerName:string;ownerEmail:string;sample:boolean;updatedAt:string};
export type PublicPet=Omit<ManagedPet,'ownerName'|'ownerEmail'|'status'|'updatedAt'|'discoveryPreferences'>;
export type SiteSettings={announcement:string;heroTitle:string;heroAccent:string;heroDescription:string;contactEmail:string};
export type PaymentPlanId='pairing_monthly'|'buyer_contacts'|'seller_individual'|'seller_breeder';
export type Plan={id:number;name:string;price:number;months:number;description:string;features:string[];active:boolean;premium:boolean;paymentPlanId?:PaymentPlanId|null};
export type Catalog={pets:PublicPet[];settings:SiteSettings;plans:Plan[];updatedAt:string;preview?:boolean;error?:string;diagnostic?:string};
