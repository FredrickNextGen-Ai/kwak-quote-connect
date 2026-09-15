# Auto Quote Connect

Build a modern, premium, production-ready spare parts e-commerce catalogue and quotation platform called KWAK AUTO SPARE.

The platform is primarily a spare-parts discovery and quotation-request system, not a traditional checkout/payment e-commerce website. Customers should be able to arrive from TikTok, Facebook, Instagram, WhatsApp, Google, or direct links, quickly find the spare parts they need, add multiple items to a quotation basket, provide their vehicle/customer details, and submit a quotation request.

The manager should have a completely separate, authenticated admin portal for managing products, viewing quotation requests, managing customers, and generating quotation PDFs.

Do NOT make the customer website overly complicated. Prioritize speed, simplicity, trust, mobile responsiveness, easy navigation, and a premium automotive feel.

1. BRAND & VISUAL DIRECTION

Brand name:

KWAK AUTO SPARE

Create a distinctive modern automotive technology aesthetic.

The design should feel inspired by premium brands such as:

Apple

Stripe

Linear

Vercel

modern automotive websites

premium automotive parts marketplaces

Avoid making it look like a generic template, basic auto-parts shop, or old-fashioned catalogue.

Use:

strong typography

generous whitespace

clean cards

subtle gradients

glassmorphism where appropriate

soft borders

smooth shadows

modern icons

high-quality product imagery

subtle automotive-inspired visual elements

strong visual hierarchy

The interface should feel trustworthy, professional and technologically advanced.

2. DARK / LIGHT MODE

Implement a complete Dark Mode and Light Mode system.

Add a custom animated theme toggle in the navbar.

The toggle should smoothly transition between:

☀ Light Mode

and

☾ Dark Mode

Do not simply switch instantly.

Use a subtle animation such as:

sun/moon rotation

smooth icon transition

background transition

button micro-animation

Persist the customer's selected theme using local storage.

The design must look excellent in BOTH modes.

Light mode:

clean white/off-white surfaces

dark typography

subtle borders

soft shadows

premium commercial feel

Dark mode:

deep charcoal/near-black backgrounds

elevated dark cards

bright readable typography

subtle borders

controlled accent lighting

premium automotive technology aesthetic

Avoid excessive pure black areas.

3. ANIMATION SYSTEM

Make the website feel modern and alive without becoming distracting.

Use smooth, professional animations throughout the interface.

Include:

page fade/slide transitions

staggered product-card entrance animations

hover elevation

image zoom on product hover

button micro-interactions

animated theme toggle

smooth mobile menu

animated search interface

quote basket count animation

modal transitions

skeleton loading states

smooth filtering

scroll reveal animations

Animations should be subtle and fast.

Do NOT use excessive bouncing, spinning, or distracting animations.

The website should still feel fast and professional.

Use Framer Motion if appropriate.

4. CUSTOMER WEBSITE STRUCTURE

Create the following public routes:

/

/parts

/parts/:id

/quote

/contact

Do NOT create unnecessary pages.

The main customer navigation should contain:

Home

Spare Parts

Request a Quote

Contact

On the right side:

Search

Theme toggle

Quote basket

On mobile, use a polished animated hamburger menu.

5. HOME PAGE

Create a visually impressive homepage.

Hero section:

Headline:

Find the Right Spare Parts. Request a Quote.

Supporting message:

Browse quality spare parts for your vehicle, add what you need to your quotation list, and send your request directly to KWAK Auto Spare.

Primary CTA:

Browse Spare Parts

Secondary CTA:

Request a Quote

Include a subtle automotive-themed visual/graphic or premium spare-parts imagery.

Do not overcrowd the hero.

Add a small trust/value section below the hero showing benefits such as:

Wide Selection

Find parts across multiple vehicle makes and models.

Easy Quotation

Add multiple parts and submit one quotation request.

Fast Response

Our team reviews your request and gets back to you.

Genuine Support

Get assistance identifying the right part for your vehicle.

6. CATEGORIES SECTION

Create a modern category section.

Example categories:

Engine Parts

Brake System

Suspension

Electrical

Transmission

Filters

Body Parts

Cooling System

Steering

Accessories

Each category should have:

icon or image

category name

short description

hover animation

Clicking a category should take the customer to the parts catalogue filtered by that category.

7. FEATURED PRODUCTS

Create a premium product grid.

Each product card should display:

product image

product name

vehicle make

vehicle model

year

OEM number

condition

availability

price if available

Add to Quote button

Example:

Toyota Hilux Front Brake Pad

Toyota · Hilux · 2019–2023

OEM: XXXXX

New

Available

[ Add to Quote ]

Do not force customers to purchase immediately.

The primary action should be:

Add to Quote

8. SPARE PARTS CATALOGUE

Create a powerful but simple /parts page.

Top section:

Find the Right Part

Search placeholder:

Search by part name, OEM number, vehicle make or model...

Include filters:

Category

Vehicle Make

Vehicle Model

Year

Condition

Availability

Price range where appropriate

Make filters easy to use on mobile.

Desktop:

Use a sidebar or modern filter panel.

Mobile:

Use an animated filter drawer.

Products should update smoothly when filters are applied.

Add sorting options:

Recommended

Newest

Price: Low to High

Price: High to Low

Include a clean result count.

Example:

124 parts found

9. PRODUCT DETAILS PAGE

Create a premium product details page.

Left side:

Large product image.

Below:

Image gallery.

Right side:

Product name

Vehicle compatibility

Category

OEM number

Condition

Availability

Price if available

Description

Then a prominent:

Add to Quote

button.

Also include:

Ask About This Part

which can open a WhatsApp conversation.

Include a vehicle compatibility section.

Example:

Compatible Vehicles:

Toyota Hilux
2019–2023

Toyota Fortuner
2018–2022

10. QUOTATION SYSTEM

This is the CORE functionality of the platform.

Customers should be able to add multiple products to a quotation basket.

The quote basket should be accessible from the navbar.

Display a small animated counter when products are added.

Example:

Quote (3)

When the customer opens /quote, display:

Your Quotation Request

Show all selected products.

Each item should include:

image

product name

vehicle

OEM

quantity selector

remove button

Allow quantity changes without leaving the page.

Then display:

Customer Details

Full Name

Phone Number

Email

Vehicle Make

Vehicle Model

Vehicle Year

Additional Message

Example placeholder:

Tell us anything that may help us identify the parts you need...

Primary button:

Send Quotation Request

11. QUOTATION SUBMISSION

When the customer submits the quotation:

Validate all required information.

Save the quotation to Supabase.

Create a unique quotation reference number.

Example:

Q-2026-0001

Save:

quotation ID

customer information

vehicle information

requested products

quantities

customer message

status

date/time

Default status:

Pending

After successful submission, display a beautiful confirmation screen.

Example:

Quotation Request Received

Your quotation reference is:

Q-2026-0001

Our team will review your request and contact you with pricing and availability.

Buttons:

Continue Browsing

Contact Us on WhatsApp

12. SUPABASE DATABASE

Prepare the frontend architecture to work with Supabase.

Use Supabase for:

products

Fields should include:

id

name

category_id

make

model

year

oem

condition

availability

price

description

image

gallery

created_at

updated_at

categories

id

name

description

image

created_at

customers

id

full_name

phone

email

created_at

quotations

id

quotation_number

customer_id

vehicle_make

vehicle_model

vehicle_year

message

status

created_at

updated_at

quotation_items

id

quotation_id

product_id

quantity

created_at

Use proper relationships between quotations, quotation_items, customers, products and categories.

Do not hardcode the product catalogue into the UI.

Create reusable services/hooks for Supabase data access.

Keep Supabase credentials in environment variables.

13. ADMIN PORTAL

Create a separate authenticated admin area.

Routes:

/admin/login

/admin/dashboard

/admin/products

/admin/quotations

/admin/customers

/admin/settings

The admin interface should feel completely different from the customer storefront while maintaining the same brand identity.

Use a professional dashboard layout with:

collapsible sidebar

top navigation

responsive mobile layout

profile/menu area

theme toggle

notifications

clean data tables

cards

charts where useful

14. ADMIN DASHBOARD

Dashboard should show:

Total Products

Pending Quotations

Quoted Requests

Completed Quotations

Total Customers

Recent Quotations

Create a simple quotation activity chart.

Example:

Quotations

Today
This Week
This Month

Use modern charts with Recharts if appropriate.

Do not overdo analytics.

The manager's most important information should be visible immediately.

15. ADMIN PRODUCTS

Create a product management page.

Manager should be able to:

view products

search products

filter products

add products

edit products

delete products

change availability

upload product images

manage categories

Product form:

Product Name

Category

Make

Model

Year

OEM

Condition

Availability

Price

Description

Main Image

Gallery

Add validation.

Use confirmation dialogs before destructive actions.

16. ADMIN QUOTATIONS

This is the most important admin module.

Create a professional quotations management interface.

Display:

Quotation Number

Customer

Phone

Vehicle

Number of Parts

Status

Date

Actions

Statuses:

Pending

Reviewing

Quoted

Completed

Cancelled

Allow the manager to update the status.

Clicking a quotation should open a detailed quotation view.

Show:

Customer information

Vehicle information

Requested parts

Quantities

Customer message

Quotation status

Created date

17. PDF QUOTATION

Create the architecture for PDF quotation generation.

The manager should have a button:

Generate PDF

The PDF should contain:

KWAK AUTO SPARE branding

Quotation number

Date

Customer details

Vehicle details

Requested parts

Quantity

Price

Subtotal

Discount if applicable

Total

Quotation status

Terms/notes

Company contact information

Use a professional business-document layout.

The PDF generation should eventually be handled by a Python backend using FastAPI + ReportLab.

Structure the frontend so it can call an API endpoint such as:

POST /api/quotations/:id/pdf

Do not implement fake PDF functionality.

Create the frontend service/API abstraction so the Python backend can be connected cleanly.

18. PYTHON BACKEND PREPARATION

The project will use a Python backend for business logic and PDF generation.

Expected architecture:

React Store/Admin

↓

Python FastAPI

↓

Supabase

↓

ReportLab PDF generation

Prepare the frontend API layer cleanly.

Do not put Python code inside the React frontend.

Keep responsibilities separated.

19. WHATSAPP INTEGRATION

Add strategically placed WhatsApp buttons.

Examples:

Ask About This Part

Need Help Finding a Part?

Chat With KWAK Auto Spare

The WhatsApp CTA should be especially visible on mobile.

When appropriate, pre-fill a message containing the product name.

Example:

"Hello KWAK Auto Spare, I am interested in Toyota Hilux Front Brake Pad. Please confirm availability and price."

Use a configurable WhatsApp number from environment/configuration rather than hardcoding it throughout the application.

20. MOBILE-FIRST EXPERIENCE

A significant percentage of customers will arrive from TikTok, Facebook and WhatsApp using mobile phones.

Therefore prioritize mobile UX.

The website must work beautifully on:

Android phones

iPhones

tablets

laptops

desktop screens

On mobile:

sticky quote button where appropriate

easy search

large tap targets

compact product cards

bottom navigation or polished mobile menu if useful

easy quotation submission

WhatsApp CTA

fast-loading images

Do not simply shrink the desktop design.

Design the mobile experience intentionally.

21. SOCIAL MEDIA TRAFFIC EXPERIENCE

Customers may arrive directly from a TikTok or Facebook post.

They should understand the website within seconds.

The homepage should immediately communicate:

Find Spare Parts → Add to Quote → Get a Response

Avoid forcing visitors to create accounts before requesting a quotation.

The quotation process should be as frictionless as possible.

22. COMPONENT ARCHITECTURE

Create reusable React components.

Suggested structure:

components/

layout/

Navbar

Footer

MobileMenu

ThemeToggle

products/

ProductCard

ProductGrid

ProductFilters

ProductSearch

CategoryCard

ProductGallery

quote/

QuoteButton

QuoteDrawer

QuoteItem

QuoteSummary

admin/

AdminSidebar

AdminHeader

StatCard

QuotationTable

QuotationDetails

ProductForm

Use reusable components instead of duplicating UI.

23. CODE QUALITY

Use:

React

JavaScript/TypeScript where appropriate

Vite

modern CSS/Tailwind if already configured

Supabase client

React Router

Framer Motion for animations

Lucide icons

Recharts for dashboard charts

Keep the application modular.

Avoid huge components.

Avoid unnecessary dependencies.

Use meaningful variable names.

Add loading states.

Add error states.

Add empty states.

Add form validation.

Make the application production-ready.

24. UX DETAILS

Every major interaction should have appropriate feedback.

Examples:

Adding product:

Added to Quote ✓

Submitting:

Sending quotation...

Success:

Quotation submitted successfully

Empty quote:

Your quotation list is empty

with:

Browse Spare Parts

button.

No search results:

No spare parts found

with suggestion to change filters.

Loading:

Use skeleton loaders instead of blank screens.

Errors:

Display friendly messages rather than raw technical errors.

25. IMPORTANT DESIGN RULE

Do NOT make this look like a generic CRUD dashboard or generic Shopify clone.

The customer-facing website should feel like a premium modern automotive spare-parts platform.

The admin portal should feel like a professional quotation and inventory management system.

The two experiences should be visually connected but functionally separate.

26. FINAL CUSTOMER JOURNEY

The complete intended journey is:

TikTok / Facebook / WhatsApp

↓

KWAK AUTO SPARE website

↓

Search for vehicle/part

↓

Browse compatible parts

↓

View product

↓

Add to Quote

↓

Continue browsing

↓

Open Quote

↓

Enter customer + vehicle details

↓

Submit quotation

↓

Receive quotation reference

↓

KWAK AUTO SPARE manager receives request

↓

Manager opens Admin Portal

↓

Reviews quotation

↓

Updates status/pricing

↓

Generates professional PDF quotation

↓

Contacts customer via phone/WhatsApp

27. FINAL GOAL

Build the foundation as a real production-ready application, not merely a visual prototype.

Prioritize:

Easy spare-parts discovery

Mobile-first UX

Fast quotation requests

Clean Supabase architecture

Secure admin authentication

Product management

Quotation management

Professional PDF generation architecture

WhatsApp integration

Modern animated UI

Excellent dark/light mode

Maintainable React architecture

Start by building the customer-facing storefront and its responsive layout, then create the quotation architecture, Supabase integration, and finally the authenticated admin portal.

Do not remove or overwrite existing useful project functionality without checking the current structure first.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kwak-quote-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6de828b9-2a05-43cd-8272-840a52a68beb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
