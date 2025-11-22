# Natours REST API

> A robust and scalable RESTful API for a tour booking application, built with Node.js, Express, and MongoDB.

![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)
![Express](https://img.shields.io/badge/Express-v4-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)

## Description

Natours is a feature-rich backend API that handles the entire logic of a tour booking platform. It allows users to book tours, write reviews, and manage their profiles. The project follows the **MVC (Model-View-Controller)** architecture to ensure code modularity and maintainability.

Key focuses of this project were advanced database interactions, security best practices, and performance optimization.

## Key Features

- **Authentication & Authorization:**
    - JWT-based authentication (stateless).
    - Role-based access control (User, Guide, Admin).
    - Password reset flow via email.
- **Tours Management:**
    - Advanced filtering, sorting, pagination, and aliasing.
    - **Geospatial queries:** Finding tours within a certain radius.
    - Aggregation pipelines for calculating tour statistics.
- **Security:**
    - Data sanitization against NoSQL query injection.
    - XSS protection and HTTP Parameter Pollution (HPP) prevention.
    - Rate limiting to prevent brute-force attacks.
- **Data Models:** Complex relationships between Users, Tours, Reviews, and Bookings.
- **Payment Integration:** Server-side integration with **Stripe**.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas) with Mongoose ORM
- **Email:** Nodemailer / SendGrid (or Mailtrap for dev)
- **Tools:** ESLint, Prettier, Postman

## API Documentation

Here are some of the main endpoints available:

| Method | Endpoint                    | Description                                  |
| :----- | :-------------------------- | :------------------------------------------- |
| `GET`  | `/api/v1/tours`             | Get all tours (allows filtering/sorting)     |
| `GET`  | `/api/v1/tours/:id`         | Get tour details                             |
| `POST` | `/api/v1/users/signup`      | Register a new user                          |
| `POST` | `/api/v1/users/login`       | Login and receive JWT                        |
| `GET`  | `/api/v1/tours/top-5-cheap` | Alias for top 5 cheapest tours               |
| `GET`  | `/api/v1/tours/tour-stats`  | Aggregated statistics using MongoDB pipeline |
