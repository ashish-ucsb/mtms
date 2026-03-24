import { NextRequest, NextResponse } from "next/server"
import requirementsData from "@/data/requirements.json"
import { Requirement } from "@/lib/types"

const requirements = requirementsData as Requirement[]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format")

  if (format === "reqif") {
    const xml = generateReqIF(requirements)
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="mtms-requirements.reqif"',
      },
    })
  }

  return NextResponse.json({ requirements })
}

function generateReqIF(reqs: Requirement[]): string {
  const now = new Date().toISOString()

  const specObjects = reqs.map((r) => `
    <SPEC-OBJECT IDENTIFIER="${r.id}" LAST-CHANGE="${now}" LONG-NAME="${r.id}">
      <VALUES>
        <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(r.title)}">
          <DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>REQ-TITLE</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>
        </ATTRIBUTE-VALUE-STRING>
        <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(r.description)}">
          <DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>REQ-DESC</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>
        </ATTRIBUTE-VALUE-STRING>
        <ATTRIBUTE-VALUE-ENUMERATION>
          <DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>REQ-TYPE</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>
          <VALUES><ENUM-VALUE-REF>${r.type}</ENUM-VALUE-REF></VALUES>
        </ATTRIBUTE-VALUE-ENUMERATION>
        <ATTRIBUTE-VALUE-ENUMERATION>
          <DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>REQ-PRIORITY</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>
          <VALUES><ENUM-VALUE-REF>${r.priority}</ENUM-VALUE-REF></VALUES>
        </ATTRIBUTE-VALUE-ENUMERATION>
        <ATTRIBUTE-VALUE-ENUMERATION>
          <DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>REQ-STATUS</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>
          <VALUES><ENUM-VALUE-REF>${r.status}</ENUM-VALUE-REF></VALUES>
        </ATTRIBUTE-VALUE-ENUMERATION>
      </VALUES>
    </SPEC-OBJECT>`).join("")

  const specHierarchy = reqs.map((r, i) => `
    <SPEC-HIERARCHY IDENTIFIER="SH-${r.id}" LAST-CHANGE="${now}" LONG-NAME="${r.id}">
      <OBJECT><SPEC-OBJECT-REF>${r.id}</SPEC-OBJECT-REF></OBJECT>
    </SPEC-HIERARCHY>`).join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <THE-HEADER>
    <REQ-IF-HEADER IDENTIFIER="MTMS-REQIF-001">
      <CREATION-TIME>${now}</CREATION-TIME>
      <REQ-IF-TOOL-ID>MTMS v0.1.0</REQ-IF-TOOL-ID>
      <REQ-IF-VERSION>1.0</REQ-IF-VERSION>
      <SOURCE-TOOL-ID>MTMS Requirements Manager</SOURCE-TOOL-ID>
      <TITLE>MTMS Software Requirements Specification</TITLE>
    </REQ-IF-HEADER>
  </THE-HEADER>
  <CORE-CONTENT>
    <REQ-IF-CONTENT>
      <DATA-TYPES>
        <DATATYPE-DEFINITION-STRING IDENTIFIER="DT-STRING" LAST-CHANGE="${now}" LONG-NAME="String" MAX-LENGTH="10000"/>
        <DATATYPE-DEFINITION-ENUMERATION IDENTIFIER="DT-TYPE" LAST-CHANGE="${now}" LONG-NAME="RequirementType">
          <SPECIFIED-VALUES>
            <ENUM-VALUE IDENTIFIER="functional"  LAST-CHANGE="${now}" LONG-NAME="functional"/>
            <ENUM-VALUE IDENTIFIER="performance" LAST-CHANGE="${now}" LONG-NAME="performance"/>
            <ENUM-VALUE IDENTIFIER="safety"      LAST-CHANGE="${now}" LONG-NAME="safety"/>
            <ENUM-VALUE IDENTIFIER="interface"   LAST-CHANGE="${now}" LONG-NAME="interface"/>
          </SPECIFIED-VALUES>
        </DATATYPE-DEFINITION-ENUMERATION>
        <DATATYPE-DEFINITION-ENUMERATION IDENTIFIER="DT-PRIORITY" LAST-CHANGE="${now}" LONG-NAME="Priority">
          <SPECIFIED-VALUES>
            <ENUM-VALUE IDENTIFIER="shall"  LAST-CHANGE="${now}" LONG-NAME="shall"/>
            <ENUM-VALUE IDENTIFIER="should" LAST-CHANGE="${now}" LONG-NAME="should"/>
            <ENUM-VALUE IDENTIFIER="may"    LAST-CHANGE="${now}" LONG-NAME="may"/>
          </SPECIFIED-VALUES>
        </DATATYPE-DEFINITION-ENUMERATION>
        <DATATYPE-DEFINITION-ENUMERATION IDENTIFIER="DT-STATUS" LAST-CHANGE="${now}" LONG-NAME="Status">
          <SPECIFIED-VALUES>
            <ENUM-VALUE IDENTIFIER="verified"   LAST-CHANGE="${now}" LONG-NAME="verified"/>
            <ENUM-VALUE IDENTIFIER="partial"    LAST-CHANGE="${now}" LONG-NAME="partial"/>
            <ENUM-VALUE IDENTIFIER="unverified" LAST-CHANGE="${now}" LONG-NAME="unverified"/>
          </SPECIFIED-VALUES>
        </DATATYPE-DEFINITION-ENUMERATION>
      </DATA-TYPES>
      <SPEC-TYPES>
        <SPEC-OBJECT-TYPE IDENTIFIER="SOT-REQ" LAST-CHANGE="${now}" LONG-NAME="Requirement">
          <SPEC-ATTRIBUTES>
            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="REQ-TITLE" LAST-CHANGE="${now}" LONG-NAME="Title">
              <TYPE><DATATYPE-DEFINITION-STRING-REF>DT-STRING</DATATYPE-DEFINITION-STRING-REF></TYPE>
            </ATTRIBUTE-DEFINITION-STRING>
            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="REQ-DESC" LAST-CHANGE="${now}" LONG-NAME="Description">
              <TYPE><DATATYPE-DEFINITION-STRING-REF>DT-STRING</DATATYPE-DEFINITION-STRING-REF></TYPE>
            </ATTRIBUTE-DEFINITION-STRING>
            <ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="REQ-TYPE" LAST-CHANGE="${now}" LONG-NAME="Type" MULTI-VALUED="false">
              <TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>DT-TYPE</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>
            </ATTRIBUTE-DEFINITION-ENUMERATION>
            <ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="REQ-PRIORITY" LAST-CHANGE="${now}" LONG-NAME="Priority" MULTI-VALUED="false">
              <TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>DT-PRIORITY</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>
            </ATTRIBUTE-DEFINITION-ENUMERATION>
            <ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="REQ-STATUS" LAST-CHANGE="${now}" LONG-NAME="Status" MULTI-VALUED="false">
              <TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>DT-STATUS</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>
            </ATTRIBUTE-DEFINITION-ENUMERATION>
          </SPEC-ATTRIBUTES>
        </SPEC-OBJECT-TYPE>
      </SPEC-TYPES>
      <SPEC-OBJECTS>${specObjects}
      </SPEC-OBJECTS>
      <SPECIFICATIONS>
        <SPECIFICATION IDENTIFIER="SPEC-MTMS-SRS" LAST-CHANGE="${now}" LONG-NAME="MTMS Software Requirements Specification">
          <CHILDREN>${specHierarchy}
          </CHILDREN>
        </SPECIFICATION>
      </SPECIFICATIONS>
    </REQ-IF-CONTENT>
  </CORE-CONTENT>
</REQ-IF>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
