'use client';
import {useState} from 'react';
import InventoryModal from './InventoryModal';
export default function ShopInventoryShell(){
 const [open,setOpen]=useState(false);
 return <><button className="ng-shop-open" onClick={()=>setOpen(true)}>📦 내 보관함</button>{open&&<InventoryModal onClose={()=>setOpen(false)}/>}</>;
}
