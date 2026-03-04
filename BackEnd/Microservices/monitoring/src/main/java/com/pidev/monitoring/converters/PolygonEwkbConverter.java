package com.pidev.monitoring.converters;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;

@Converter
public class PolygonEwkbConverter implements AttributeConverter<Polygon, byte[]> {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public byte[] convertToDatabaseColumn(Polygon polygon) {
        if (polygon == null) return null;
        // Write as EWKB binary (2D + SRID embedded)
        return new WKBWriter(2, true).write(polygon);
    }

    @Override
    public Polygon convertToEntityAttribute(byte[] dbData) {
        if (dbData == null || dbData.length == 0) return null;
        try {
            WKBReader reader = new WKBReader(GEOMETRY_FACTORY);
            byte[] actualBytes;

            // ✅ PostgreSQL returns geometry as hex-encoded EWKB string over JDBC.
            // Hibernate gives us the bytes of that hex string, not decoded binary.
            // We detect this by checking if all bytes are valid hex chars (0-9, a-f, A-F).
            if (isHexEncoded(dbData)) {
                // Convert the hex string bytes → actual binary EWKB bytes
                actualBytes = WKBReader.hexToBytes(new String(dbData));
            } else {
                actualBytes = dbData;
            }

            Geometry geometry = reader.read(actualBytes);
            if (geometry instanceof Polygon polygon) {
                if (polygon.getSRID() == 0) polygon.setSRID(4326);
                return polygon;
            }
            throw new IllegalStateException("Expected Polygon, got: " + geometry.getGeometryType());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse geometry: " + e.getMessage(), e);
        }
    }

    /**
     * Checks if the byte array represents a hex-encoded string.
     * PostgreSQL returns geometry columns as hex strings like "0103000020E610..."
     * The first byte of real EWKB is always 0x00 or 0x01 (endian flag).
     * If the first byte is '0' (0x30) or '1' (0x31), it's a hex string.
     */
    private boolean isHexEncoded(byte[] data) {
        if (data.length < 2) return false;
        // Real EWKB starts with 0x00 (big-endian) or 0x01 (little-endian)
        // Hex string starts with ASCII '0'=0x30 or '1'=0x31
        return data[0] == '0' || data[0] == '1';
    }
}