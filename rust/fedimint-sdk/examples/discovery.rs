//! Queries an app-supplied discovery URL and prints every valid federation found.
//!
//! Usage: `cargo run --example discovery <data-dir> <url>`
//!
//! Example:
//! ```bash
//! cargo run --example discovery /tmp/fedimint-test http://127.0.0.1:8000/federations.json
//! ```

mod common;

#[tokio::main]
async fn main() -> fedimint_sdk::Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let usage = "usage: discovery <data-dir> <url>";
    let (data_dir, url) = match args.as_slice() {
        [data_dir, url] => (data_dir.as_str(), url.as_str()),
        _ => common::usage(usage),
    };

    let sdk = common::build(data_dir).await?;

    println!("Querying discovery endpoint at {url}...\n");
    let federations = sdk.discover_federations(url).await?;

    if federations.is_empty() {
        println!("No federations found (empty list or entries were expired/filtered).");
        return Ok(());
    }

    println!("Discovered {} federation(s):", federations.len());
    for (i, fed) in federations.iter().enumerate() {
        println!("\n[{}] Federation ID: {}", i + 1, fed.id);
        println!("    Invite Code:   {}", fed.invite.display());
        if !fed.metadata.is_empty() {
            println!("    Metadata:");
            for (k, v) in &fed.metadata {
                println!("      - {k}: {v}");
            }
        }
    }

    Ok(())
}
