export type PetMarketStatus='pending'|'approved'|'rejected'|'sold'|'paused';
export type PetMarketEnquiryStatus='pending'|'accepted'|'declined';
export type PrivateMarketDocument={key:string;name:string;type:string;size:number};
export type PetMarketListing={
 id:number;petName:string;type:'Dog'|'Cat';breed:string;age:string;gender:'Male'|'Female';location:string;
 price:number;currency:'INR';description:string;vaccination:string;health:string;vetClinic:string;
 photos:string[];photoTitles:string[];sellerKind:'individual'|'breeder'|'organization';sellerName:string;sellerEmail:string;sellerPhone:string;
 establishmentName:string;registrationNumber:string;registrationDocument:PrivateMarketDocument|null;vetDocument:PrivateMarketDocument|null;
 sellerVerified:boolean;status:PetMarketStatus;createdAt:string;updatedAt:string;sample?:boolean;
};
export type PetMarketEnquiry={
 id:number;listingId:number;buyerName:string;buyerEmail:string;buyerPhone:string;message:string;status:PetMarketEnquiryStatus;createdAt:string;
};
export type PublicPetMarketListing=Omit<PetMarketListing,'sellerName'|'sellerEmail'|'sellerPhone'|'registrationNumber'|'registrationDocument'|'vetDocument'|'vetClinic'|'establishmentName'> & {sample?:boolean};
