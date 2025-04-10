
## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rahul-omni/legal-ai
   cd legal-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```properties
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_supabase_database_url
   DIRECT_URL=your_supabase_direct_database_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI services.
- `DATABASE_URL`: Connection string for the database (used for connection pooling).
- `DIRECT_URL`: Direct connection string for database migrations.


## Contributing

1. Pull the latest stable code from main branch.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for AI-powered tools.
- [Supabase](https://supabase.com/) for backend services.
