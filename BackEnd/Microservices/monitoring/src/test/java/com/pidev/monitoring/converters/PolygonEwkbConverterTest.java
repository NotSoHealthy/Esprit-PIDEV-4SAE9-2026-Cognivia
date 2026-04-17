package com.pidev.monitoring.converters;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKBWriter;

class PolygonEwkbConverterTest {

    private static final GeometryFactory FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Test
    void convertToDatabaseColumn_returnsNullForNull() {
        PolygonEwkbConverter converter = new PolygonEwkbConverter();
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @Test
    void convertToEntityAttribute_returnsNullForNullOrEmpty() {
        PolygonEwkbConverter converter = new PolygonEwkbConverter();
        assertNull(converter.convertToEntityAttribute(null));
        assertNull(converter.convertToEntityAttribute(new byte[0]));
    }

    @Test
    void convertToEntityAttribute_parsesBinaryEwkbAndEnsuresSrid() {
        Polygon poly = squarePolygon();
        poly.setSRID(4326);

        PolygonEwkbConverter converter = new PolygonEwkbConverter();
        byte[] bytes = converter.convertToDatabaseColumn(poly);
        Polygon parsed = converter.convertToEntityAttribute(bytes);

        assertNotNull(parsed);
        assertEquals("Polygon", parsed.getGeometryType());
        assertEquals(4326, parsed.getSRID());
    }

    @Test
    void convertToEntityAttribute_parsesHexEncodedEwkb() {
        Polygon poly = squarePolygon();
        poly.setSRID(4326);

        byte[] binary = new WKBWriter(2, true).write(poly);
        String hex = WKBWriter.toHex(binary);
        byte[] hexBytes = hex.getBytes();

        PolygonEwkbConverter converter = new PolygonEwkbConverter();
        Polygon parsed = converter.convertToEntityAttribute(hexBytes);

        assertNotNull(parsed);
        assertEquals(4326, parsed.getSRID());
    }

    @Test
    void convertToEntityAttribute_throwsWhenNotPolygon() {
        GeometryFactory f = FACTORY;
        Point point = f.createPoint(new Coordinate(1, 2));
        point.setSRID(4326);
        byte[] bytes = new WKBWriter(2, true).write(point);

        PolygonEwkbConverter converter = new PolygonEwkbConverter();
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> converter.convertToEntityAttribute(bytes));
        assertTrue(ex.getMessage().contains("Expected Polygon"));
    }

    private static Polygon squarePolygon() {
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(0, 0),
                new Coordinate(0, 1),
                new Coordinate(1, 1),
                new Coordinate(0, 0)
        };
        LinearRing ring = FACTORY.createLinearRing(coords);
        return FACTORY.createPolygon(ring);
    }
}
