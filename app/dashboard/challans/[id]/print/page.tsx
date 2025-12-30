import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ChallanPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const challan = await prisma.challan.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      createdBy: true,
      items: {
        include: {
          item: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!challan) {
    notFound();
  }

  return (
    <html>
      <head>
        <title>Challan {challan.challanNumber}</title>
        <style>{`
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .challan-title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
          }
          .info-section {
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
          }
          .info-box {
            width: 48%;
          }
          .info-row {
            margin: 8px 0;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            width: 140px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            border-top: 1px solid #000;
            padding-top: 10px;
            text-align: center;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        `}</style>
      </head>
      <body>
        <button
          className="no-print"
          onClick={() => window.print()}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "10px 20px",
            backgroundColor: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Print Challan
        </button>

        <div className="header">
          <div className="company-name">YOUR COMPANY NAME</div>
          <div>Event Management & Tent Rental Services</div>
          <div>Address Line 1, City, State - PIN</div>
          <div>Phone: +91-XXXXXXXXXX | Email: info@company.com</div>
          <div className="challan-title">DELIVERY CHALLAN</div>
        </div>

        <div className="info-section">
          <div className="info-box">
            <div className="info-row">
              <span className="label">Challan Number:</span>
              <span>{challan.challanNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">Issue Date:</span>
              <span>{new Date(challan.issueDate).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="label">Expected Return:</span>
              <span>
                {challan.expectedReturnDate
                  ? new Date(challan.expectedReturnDate).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>

          <div className="info-box">
            <div className="info-row">
              <span className="label">Project:</span>
              <span>{challan.project.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Location:</span>
              <span>{challan.project.location}</span>
            </div>
            <div className="info-row">
              <span className="label">Project Type:</span>
              <span>{challan.project.type.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {challan.remarks && (
          <div style={{ margin: "20px 0", padding: "10px", backgroundColor: "#f9f9f9", border: "1px solid #ddd" }}>
            <strong>Remarks:</strong> {challan.remarks}
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.item.name}</td>
                <td>{item.item.category.name}</td>
                <td>{item.quantity}</td>
                <td>{item.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "20px", textAlign: "right", fontWeight: "bold" }}>
          Total Items: {challan.items.length}
        </div>

        <div className="signatures">
          <div className="signature-box">
            <div>Issued By</div>
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {challan.createdBy.name}
            </div>
          </div>
          <div className="signature-box">
            <div>Received By</div>
            <div style={{ marginTop: "10px" }}>(Signature & Stamp)</div>
          </div>
        </div>

        <div className="footer">
          <p>This is a computer-generated document and does not require a signature.</p>
          <p>
            Generated on: {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </body>
    </html>
  );
}
