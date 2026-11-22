"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { memo, useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { TRUCK_STATUS } from "@/lib/status";
import type { LatLng, Truck } from "@/lib/types";
import { DEPOTS, SITES } from "@/server/seed";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAllTrucks, selectSelectedTruck } from "@/store/selectors";
import { truckSelected } from "@/store/slices";

const SG_CENTER: [number, number] = [1.3521, 103.8198];
const toTuple = (p: LatLng): [number, number] => [p.lat, p.lng];

// Icons are cached by (status, heading bucket, selected) so we don't build a new
// DOM icon for every truck on every one-second update.
const iconCache = new Map<string, L.DivIcon>();
function truckIcon(truck: Truck, selected: boolean): L.DivIcon {
  const heading = Math.round(truck.heading / 10) * 10;
  const key = `${truck.status}:${heading}:${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const color = TRUCK_STATUS[truck.status].color;
    icon = L.divIcon({
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `<div class="truck-marker${selected ? " is-selected" : ""}" style="--c:${color}">
        <svg viewBox="0 0 24 24" width="16" height="16" style="transform:rotate(${heading}deg)" aria-hidden="true">
          <path d="M12 2 20 21 12 16.5 4 21Z" fill="white"/>
        </svg></div>`,
    });
    iconCache.set(key, icon);
  }
  return icon;
}

const TruckMarker = memo(function TruckMarker({
  truck,
  selected,
  onSelect,
}: {
  truck: Truck;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Marker
      position={toTuple(truck.position)}
      icon={truckIcon(truck, selected)}
      zIndexOffset={selected ? 1000 : 0}
      keyboard
      title={`${truck.plate} — ${TRUCK_STATUS[truck.status].label}`}
      eventHandlers={{ click: () => onSelect(truck.id) }}
    >
      <Tooltip direction="top" offset={[0, -14]}>
        <strong>{truck.plate}</strong> · {TRUCK_STATUS[truck.status].label}
        <br />
        {truck.driver}
      </Tooltip>
    </Marker>
  );
});

/** Pans to a truck when it becomes selected (not on every position update). */
function FollowSelection({ truck }: { truck: Truck | null }) {
  const map = useMap();
  const positionRef = useRef(truck?.position);
  positionRef.current = truck?.position;
  const id = truck?.id;

  useEffect(() => {
    if (id && positionRef.current) {
      map.flyTo(toTuple(positionRef.current), Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  }, [id, map]);
  return null;
}

function SelectedRoute({ truck }: { truck: Truck }) {
  const job = useAppSelector((s) => (truck.jobId ? s.jobs.entities[truck.jobId] : undefined));
  if (!job) return null;
  const points =
    truck.status === "to_pickup"
      ? [truck.position, job.pickup.position, job.dropoff.position]
      : [truck.position, job.dropoff.position];
  return (
    <Polyline
      positions={points.map(toTuple)}
      pathOptions={{ color: TRUCK_STATUS[truck.status].color, weight: 3, dashArray: "6 8", opacity: 0.8 }}
    />
  );
}

export default function FleetMap() {
  const dispatch = useAppDispatch();
  const trucks = useAppSelector(selectAllTrucks);
  const selected = useAppSelector(selectSelectedTruck);
  const onSelect = (id: string) => dispatch(truckSelected(id));

  return (
    <MapContainer center={SG_CENTER} zoom={11} minZoom={10} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />

      {DEPOTS.map((d) => (
        <CircleMarker
          key={d.name}
          center={toTuple(d.position)}
          radius={7}
          pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 0.85, weight: 2 }}
        >
          <Tooltip>Depot · {d.name}</Tooltip>
        </CircleMarker>
      ))}
      {SITES.map((s) => (
        <CircleMarker
          key={s.name}
          center={toTuple(s.position)}
          radius={6}
          pathOptions={{ color: "#059669", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip>Site · {s.name}</Tooltip>
        </CircleMarker>
      ))}

      {selected && <SelectedRoute truck={selected} />}

      {trucks.map((truck) => (
        <TruckMarker key={truck.id} truck={truck} selected={truck.id === selected?.id} onSelect={onSelect} />
      ))}

      <FollowSelection truck={selected} />
    </MapContainer>
  );
}
