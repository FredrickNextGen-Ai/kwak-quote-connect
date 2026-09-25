from collections import Counter
from typing import Any

from app.supabase_client import supabase


def fetch_quotations() -> list[dict]:
	response = (
		supabase
		.table("quotations")
		.select(
			"""
			*,
			quotation_items(*)
			"""
		)
		.order("created_at", desc=True)
		.execute()
	)

	return response.data or []


def quotation_value(quotation: dict) -> float:
	total = 0.0

	for item in quotation.get("quotation_items", []):
		quantity = float(item.get("quantity") or 0)
		unit_price = float(item.get("unit_price") or 0)
		total += quantity * unit_price

	discount = float(quotation.get("discount") or 0)

	return max(total - discount, 0)


def analyze_quotations(
	quotations: list[dict],
) -> dict[str, Any]:
	total = len(quotations)

	status_counts = Counter(
		quotation.get("status", "Unknown")
		for quotation in quotations
	)

	total_value = sum(
		quotation_value(quotation)
		for quotation in quotations
	)

	completed = status_counts.get("Completed", 0)
	cancelled = status_counts.get("Cancelled", 0)

	completion_rate = completed / total * 100 if total else 0
	cancellation_rate = cancelled / total * 100 if total else 0

	product_quantity = Counter()

	for quotation in quotations:
		for item in quotation.get("quotation_items", []):
			name = item.get("product_name") or "Unknown product"
			product_quantity[name] += int(item.get("quantity") or 0)

	top_products = [
		{"name": name, "quantity": quantity}
		for name, quantity in product_quantity.most_common(10)
	]

	vehicle_counts = Counter(
		quotation.get("vehicle_make")
		for quotation in quotations
		if quotation.get("vehicle_make")
	)

	top_vehicle_makes = [
		{"make": make, "quotations": count}
		for make, count in vehicle_counts.most_common(10)
	]

	customer_counts = Counter(
		quotation.get("customer_id")
		for quotation in quotations
		if quotation.get("customer_id")
	)

	returning_customers = sum(
		1
		for count in customer_counts.values()
		if count > 1
	)

	insights = []
	pending = status_counts.get("Pending", 0)

	if total and pending / total >= 0.4:
		insights.append({
			"type": "operations",
			"title": "High pending workload",
			"description": f"{pending} of {total} quotations are pending.",
		})

	if top_products:
		insights.append({
			"type": "product",
			"title": "Highest product demand",
			"description": (
				f"{top_products[0]['name']} has the highest requested quantity."
			),
		})

	if top_vehicle_makes:
		insights.append({
			"type": "vehicle",
			"title": "Most requested vehicle make",
			"description": (
				f"{top_vehicle_makes[0]['make']} appears most frequently."
			),
		})

	if returning_customers:
		insights.append({
			"type": "customer",
			"title": "Returning customer activity",
			"description": (
				f"{returning_customers} customers submitted multiple quotations."
			),
		})

	return {
		"summary": {
			"total_quotations": total,
			"total_value": round(total_value, 2),
			"average_value": round(total_value / total, 2) if total else 0,
			"completion_rate": round(completion_rate, 2),
			"cancellation_rate": round(cancellation_rate, 2),
		},
		"status": dict(status_counts),
		"products": top_products,
		"vehicles": top_vehicle_makes,
		"customers": {
			"returning": returning_customers,
		},
		"insights": insights,
	}
